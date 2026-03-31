using Microsoft.AspNetCore.Mvc;
using Todo.Api.Contracts;
using Todo.Api.Models;
using Todo.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://frontend")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddSingleton<JsonStoreService>();
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddSingleton<TokenService>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("Frontend");
app.UseSwagger();
app.UseSwaggerUI();
app.MapOpenApi();

app.MapGet("/", () => Results.Redirect("/swagger"))
    .ExcludeFromDescription();

app.MapPost("/api/auth/register", async (
    RegisterRequest request,
    JsonStoreService store,
    PasswordService passwordService,
    CancellationToken cancellationToken) =>
{
    var errors = request.ValidateObject();
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors, title: "Validation failed", type: "https://httpstatuses.com/400");
    }

    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    var outcome = await store.MutateAsync(storeData =>
    {
        if (storeData.Users.Any(user => string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase)))
        {
            return new RegisterOutcome(null, true);
        }

        var passwordResult = passwordService.Hash(request.Password);
        var user = new UserRecord
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = passwordResult.Hash,
            PasswordSalt = passwordResult.Salt,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        storeData.Users.Add(user);
        return new RegisterOutcome(user, false);
    }, cancellationToken);

    if (outcome.Conflict)
    {
        return Results.Problem(
            title: "Email already registered",
            detail: "A user with this email already exists.",
            statusCode: StatusCodes.Status409Conflict,
            type: "https://httpstatuses.com/409");
    }

    var userResponse = new AuthUserResponse(outcome.User!.Id, outcome.User.Email, outcome.User.DisplayName);
    return Results.Created($"/api/users/{outcome.User.Id}", userResponse);
})
.WithTags("Auth")
.Produces<AuthUserResponse>(StatusCodes.Status201Created)
.ProducesProblem(StatusCodes.Status409Conflict)
.ProducesValidationProblem();

app.MapPost("/api/auth/login", async (
    LoginRequest request,
    JsonStoreService store,
    PasswordService passwordService,
    TokenService tokenService,
    CancellationToken cancellationToken) =>
{
    var errors = request.ValidateObject();
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors, title: "Validation failed", type: "https://httpstatuses.com/400");
    }

    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    var snapshot = await store.ReadAsync(cancellationToken);
    var user = snapshot.Users.FirstOrDefault(candidate => string.Equals(candidate.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase));
    if (user is null || !passwordService.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
    {
        return Results.Problem(
            title: "Invalid credentials",
            detail: "Email or password is incorrect.",
            statusCode: StatusCodes.Status401Unauthorized,
            type: "https://httpstatuses.com/401");
    }

    var token = tokenService.GenerateAccessToken();
    await store.MutateAsync(storeData =>
    {
        storeData.Tokens.RemoveAll(existing => existing.UserId == user.Id || existing.ExpiresAtUtc <= DateTime.UtcNow);
        storeData.Tokens.Add(new TokenRecord
        {
            Value = token,
            UserId = user.Id,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddSeconds(TokenService.ExpiresInSeconds)
        });
        return true;
    }, cancellationToken);

    return Results.Ok(new LoginResponse(
        token,
        "Bearer",
        TokenService.ExpiresInSeconds,
        new AuthUserResponse(user.Id, user.Email, user.DisplayName)));
})
.WithTags("Auth")
.Produces<LoginResponse>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesValidationProblem();

app.MapGet("/api/todos/public", async (
    int? page,
    int? pageSize,
    string? search,
    string? status,
    string? priority,
    string? sortBy,
    string? sortDir,
    JsonStoreService store,
    CancellationToken cancellationToken) =>
{
    var query = new TodoQueryParameters
    {
        Page = page ?? 1,
        PageSize = pageSize ?? 10,
        Search = search,
        Status = status ?? "all",
        Priority = priority,
        SortBy = sortBy ?? "createdAt",
        SortDir = sortDir ?? "desc"
    };

    var queryValidation = ValidateTodoQuery(query);
    if (queryValidation.Count > 0)
    {
        return Results.ValidationProblem(queryValidation, title: "Validation failed", type: "https://httpstatuses.com/400");
    }

    var snapshot = await store.ReadAsync(cancellationToken);
    var paged = ApplyQuery(snapshot.Todos.Where(todo => todo.IsPublic), query);
    return Results.Ok(paged);
})
.WithTags("Todos")
.Produces<PagedResponse<TodoResponse>>(StatusCodes.Status200OK)
.ProducesValidationProblem();

app.MapGet("/api/todos", async (
    int? page,
    int? pageSize,
    string? search,
    string? status,
    string? priority,
    string? sortBy,
    string? sortDir,
    JsonStoreService store,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var user = await AuthContextHelpers.GetAuthenticatedUserAsync(httpContext, store, cancellationToken);
    if (user is null)
    {
        return AuthContextHelpers.UnauthorizedProblem();
    }

    var query = new TodoQueryParameters
    {
        Page = page ?? 1,
        PageSize = pageSize ?? 10,
        Search = search,
        Status = status ?? "all",
        Priority = priority,
        SortBy = sortBy ?? "createdAt",
        SortDir = sortDir ?? "desc"
    };

    var queryValidation = ValidateTodoQuery(query);
    if (queryValidation.Count > 0)
    {
        return Results.ValidationProblem(queryValidation, title: "Validation failed", type: "https://httpstatuses.com/400");
    }

    var snapshot = await store.ReadAsync(cancellationToken);
    var paged = ApplyQuery(snapshot.Todos.Where(todo => todo.OwnerId == user.Id), query);
    return Results.Ok(paged);
})
.WithTags("Todos")
.Produces<PagedResponse<TodoResponse>>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesValidationProblem();

app.MapGet("/api/todos/{id:guid}", async (
    Guid id,
    JsonStoreService store,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var user = await AuthContextHelpers.GetAuthenticatedUserAsync(httpContext, store, cancellationToken);
    if (user is null)
    {
        return AuthContextHelpers.UnauthorizedProblem();
    }

    var snapshot = await store.ReadAsync(cancellationToken);
    var todo = snapshot.Todos.FirstOrDefault(item => item.Id == id);
    if (todo is null)
    {
        return Results.Problem(title: "Todo not found", statusCode: StatusCodes.Status404NotFound, type: "https://httpstatuses.com/404");
    }

    if (todo.OwnerId != user.Id)
    {
        return Results.Problem(title: "Forbidden", detail: "You cannot access this todo.", statusCode: StatusCodes.Status403Forbidden, type: "https://httpstatuses.com/403");
    }

    return Results.Ok(todo.ToResponse());
})
.WithTags("Todos")
.Produces<TodoResponse>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesProblem(StatusCodes.Status403Forbidden)
.ProducesProblem(StatusCodes.Status404NotFound);

app.MapPost("/api/todos", async (
    CreateTodoRequest request,
    JsonStoreService store,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var user = await AuthContextHelpers.GetAuthenticatedUserAsync(httpContext, store, cancellationToken);
    if (user is null)
    {
        return AuthContextHelpers.UnauthorizedProblem();
    }

    var errors = request.ValidateObject();
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors, title: "Validation failed", type: "https://httpstatuses.com/400");
    }

    var created = await store.MutateAsync(storeData =>
    {
        var now = DateTime.UtcNow;
        var todo = new TodoRecord
        {
            Id = Guid.NewGuid(),
            OwnerId = user.Id,
            Title = request.Title.Trim(),
            Details = request.Details?.Trim() ?? string.Empty,
            Priority = request.Priority,
            DueDate = request.DueDate,
            IsPublic = request.IsPublic,
            IsCompleted = false,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        storeData.Todos.Add(todo);
        return todo;
    }, cancellationToken);

    return Results.Created($"/api/todos/{created.Id}", created.ToResponse());
})
.WithTags("Todos")
.Produces<TodoResponse>(StatusCodes.Status201Created)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesValidationProblem();

app.MapPut("/api/todos/{id:guid}", async (
    Guid id,
    UpdateTodoRequest request,
    JsonStoreService store,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var user = await AuthContextHelpers.GetAuthenticatedUserAsync(httpContext, store, cancellationToken);
    if (user is null)
    {
        return AuthContextHelpers.UnauthorizedProblem();
    }

    var errors = request.ValidateObject();
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors, title: "Validation failed", type: "https://httpstatuses.com/400");
    }

    var outcome = await store.MutateAsync(storeData =>
    {
        var todo = storeData.Todos.FirstOrDefault(item => item.Id == id);
        if (todo is null)
        {
            return new TodoMutationOutcome(null, StatusCodes.Status404NotFound);
        }

        if (todo.OwnerId != user.Id)
        {
            return new TodoMutationOutcome(null, StatusCodes.Status403Forbidden);
        }

        todo.Title = request.Title.Trim();
        todo.Details = request.Details?.Trim() ?? string.Empty;
        todo.Priority = request.Priority;
        todo.DueDate = request.DueDate;
        todo.IsPublic = request.IsPublic;
        todo.IsCompleted = request.IsCompleted;
        todo.UpdatedAtUtc = DateTime.UtcNow;
        return new TodoMutationOutcome(todo, StatusCodes.Status200OK);
    }, cancellationToken);

    return outcome.StatusCode switch
    {
        StatusCodes.Status404NotFound => Results.Problem(title: "Todo not found", statusCode: StatusCodes.Status404NotFound, type: "https://httpstatuses.com/404"),
        StatusCodes.Status403Forbidden => Results.Problem(title: "Forbidden", detail: "You cannot access this todo.", statusCode: StatusCodes.Status403Forbidden, type: "https://httpstatuses.com/403"),
        _ => Results.Ok(outcome.Todo!.ToResponse())
    };
})
.WithTags("Todos")
.Produces<TodoResponse>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesProblem(StatusCodes.Status403Forbidden)
.ProducesProblem(StatusCodes.Status404NotFound)
.ProducesValidationProblem();

app.MapPatch("/api/todos/{id:guid}/completion", async (
    Guid id,
    SetCompletionRequest request,
    JsonStoreService store,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var user = await AuthContextHelpers.GetAuthenticatedUserAsync(httpContext, store, cancellationToken);
    if (user is null)
    {
        return AuthContextHelpers.UnauthorizedProblem();
    }

    var outcome = await store.MutateAsync(storeData =>
    {
        var todo = storeData.Todos.FirstOrDefault(item => item.Id == id);
        if (todo is null)
        {
            return new TodoMutationOutcome(null, StatusCodes.Status404NotFound);
        }

        if (todo.OwnerId != user.Id)
        {
            return new TodoMutationOutcome(null, StatusCodes.Status403Forbidden);
        }

        todo.IsCompleted = request.IsCompleted;
        todo.UpdatedAtUtc = DateTime.UtcNow;
        return new TodoMutationOutcome(todo, StatusCodes.Status200OK);
    }, cancellationToken);

    return outcome.StatusCode switch
    {
        StatusCodes.Status404NotFound => Results.Problem(title: "Todo not found", statusCode: StatusCodes.Status404NotFound, type: "https://httpstatuses.com/404"),
        StatusCodes.Status403Forbidden => Results.Problem(title: "Forbidden", detail: "You cannot access this todo.", statusCode: StatusCodes.Status403Forbidden, type: "https://httpstatuses.com/403"),
        _ => Results.Ok(outcome.Todo!.ToResponse())
    };
})
.WithTags("Todos")
.Produces<TodoResponse>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesProblem(StatusCodes.Status403Forbidden)
.ProducesProblem(StatusCodes.Status404NotFound);

app.MapDelete("/api/todos/{id:guid}", async (
    Guid id,
    JsonStoreService store,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var user = await AuthContextHelpers.GetAuthenticatedUserAsync(httpContext, store, cancellationToken);
    if (user is null)
    {
        return AuthContextHelpers.UnauthorizedProblem();
    }

    var statusCode = await store.MutateAsync(storeData =>
    {
        var todo = storeData.Todos.FirstOrDefault(item => item.Id == id);
        if (todo is null)
        {
            return StatusCodes.Status404NotFound;
        }

        if (todo.OwnerId != user.Id)
        {
            return StatusCodes.Status403Forbidden;
        }

        storeData.Todos.Remove(todo);
        return StatusCodes.Status204NoContent;
    }, cancellationToken);

    return statusCode switch
    {
        StatusCodes.Status404NotFound => Results.Problem(title: "Todo not found", statusCode: StatusCodes.Status404NotFound, type: "https://httpstatuses.com/404"),
        StatusCodes.Status403Forbidden => Results.Problem(title: "Forbidden", detail: "You cannot access this todo.", statusCode: StatusCodes.Status403Forbidden, type: "https://httpstatuses.com/403"),
        _ => Results.NoContent()
    };
})
.WithTags("Todos")
.Produces(StatusCodes.Status204NoContent)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesProblem(StatusCodes.Status403Forbidden)
.ProducesProblem(StatusCodes.Status404NotFound);

app.Run();

static Dictionary<string, string[]> ValidateTodoQuery(TodoQueryParameters query)
{
    var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
    var page = query.Page <= 0 ? 1 : query.Page;
    var pageSize = query.PageSize <= 0 ? 10 : query.PageSize;

    if (page < 1)
    {
        errors["page"] = ["Page must be greater than 0."];
    }

    if (pageSize < 1 || pageSize > 100)
    {
        errors["pageSize"] = ["Page size must be between 1 and 100."];
    }

    if (!string.IsNullOrWhiteSpace(query.Status) && !new[] { "all", "active", "completed" }.Contains(query.Status, StringComparer.OrdinalIgnoreCase))
    {
        errors["status"] = ["Status must be one of: all, active, completed."];
    }

    if (!string.IsNullOrWhiteSpace(query.Priority) && !new[] { "low", "medium", "high" }.Contains(query.Priority, StringComparer.OrdinalIgnoreCase))
    {
        errors["priority"] = ["Priority must be one of: low, medium, high."];
    }

    if (!string.IsNullOrWhiteSpace(query.SortBy) && !new[] { "createdAt", "dueDate", "priority", "title" }.Contains(query.SortBy, StringComparer.OrdinalIgnoreCase))
    {
        errors["sortBy"] = ["SortBy must be one of: createdAt, dueDate, priority, title."];
    }

    if (!string.IsNullOrWhiteSpace(query.SortDir) && !new[] { "asc", "desc" }.Contains(query.SortDir, StringComparer.OrdinalIgnoreCase))
    {
        errors["sortDir"] = ["SortDir must be either asc or desc."];
    }

    return errors;
}

static PagedResponse<TodoResponse> ApplyQuery(IEnumerable<TodoRecord> source, TodoQueryParameters query)
{
    var page = query.Page <= 0 ? 1 : query.Page;
    var pageSize = query.PageSize <= 0 ? 10 : query.PageSize;
    var filtered = source;

    if (!string.IsNullOrWhiteSpace(query.Search))
    {
        var search = query.Search.Trim();
        filtered = filtered.Where(todo =>
            todo.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            todo.Details.Contains(search, StringComparison.OrdinalIgnoreCase));
    }

    if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "all", StringComparison.OrdinalIgnoreCase))
    {
        var completed = string.Equals(query.Status, "completed", StringComparison.OrdinalIgnoreCase);
        filtered = filtered.Where(todo => todo.IsCompleted == completed);
    }

    if (!string.IsNullOrWhiteSpace(query.Priority))
    {
        filtered = filtered.Where(todo => string.Equals(todo.Priority, query.Priority, StringComparison.OrdinalIgnoreCase));
    }

    filtered = (query.SortBy?.ToLowerInvariant(), query.SortDir?.ToLowerInvariant()) switch
    {
        ("duedate", "asc") => filtered.OrderBy(todo => todo.DueDate.HasValue ? 0 : 1).ThenBy(todo => todo.DueDate).ThenBy(todo => todo.Title, StringComparer.OrdinalIgnoreCase),
        ("duedate", _) => filtered.OrderBy(todo => todo.DueDate.HasValue ? 1 : 0).ThenByDescending(todo => todo.DueDate).ThenBy(todo => todo.Title, StringComparer.OrdinalIgnoreCase),
        ("priority", "asc") => filtered.OrderBy(todo => PriorityRank(todo.Priority)).ThenBy(todo => todo.Title, StringComparer.OrdinalIgnoreCase),
        ("priority", _) => filtered.OrderByDescending(todo => PriorityRank(todo.Priority)).ThenBy(todo => todo.Title, StringComparer.OrdinalIgnoreCase),
        ("title", "asc") => filtered.OrderBy(todo => todo.Title, StringComparer.OrdinalIgnoreCase),
        ("title", _) => filtered.OrderByDescending(todo => todo.Title, StringComparer.OrdinalIgnoreCase),
        ("createdat", "asc") => filtered.OrderBy(todo => todo.CreatedAtUtc),
        _ => filtered.OrderByDescending(todo => todo.CreatedAtUtc)
    };

    var totalItems = filtered.Count();
    var totalPages = Math.Max(1, (int)Math.Ceiling(totalItems / (double)pageSize));
    page = Math.Min(page, totalPages);
    var items = filtered
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(todo => todo.ToResponse())
        .ToList();

    return new PagedResponse<TodoResponse>(items, page, pageSize, totalItems, totalPages);
}

static int PriorityRank(string priority) => priority.ToLowerInvariant() switch
{
    "high" => 3,
    "medium" => 2,
    _ => 1
};

file sealed record RegisterOutcome(UserRecord? User, bool Conflict);

file sealed record TodoMutationOutcome(TodoRecord? Todo, int StatusCode);
