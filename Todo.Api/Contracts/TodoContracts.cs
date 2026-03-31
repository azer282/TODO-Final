using System.ComponentModel.DataAnnotations;

namespace Todo.Api.Contracts;

public sealed class CreateTodoRequest
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(2000)]
    public string? Details { get; init; }

    [Required]
    [RegularExpression("^(low|medium|high)$")]
    public string Priority { get; init; } = "medium";

    public DateOnly? DueDate { get; init; }

    public bool IsPublic { get; init; }
}

public sealed class UpdateTodoRequest
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(2000)]
    public string? Details { get; init; }

    [Required]
    [RegularExpression("^(low|medium|high)$")]
    public string Priority { get; init; } = "medium";

    public DateOnly? DueDate { get; init; }

    public bool IsPublic { get; init; }

    public bool IsCompleted { get; init; }
}

public sealed class SetCompletionRequest
{
    public bool IsCompleted { get; init; }
}

public sealed record TodoResponse(
    Guid Id,
    string Title,
    string Details,
    string Priority,
    DateOnly? DueDate,
    bool IsCompleted,
    bool IsPublic,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems, int TotalPages);
