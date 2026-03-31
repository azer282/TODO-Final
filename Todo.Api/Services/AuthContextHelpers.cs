using Todo.Api.Models;

namespace Todo.Api.Services;

public static class AuthContextHelpers
{
    public static async Task<UserRecord?> GetAuthenticatedUserAsync(HttpContext httpContext, JsonStoreService store, CancellationToken cancellationToken)
    {
        if (!httpContext.Request.Headers.Authorization.Any())
        {
            return null;
        }

        var headerValue = httpContext.Request.Headers.Authorization.ToString();
        if (!headerValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var tokenValue = headerValue["Bearer ".Length..].Trim();
        if (string.IsNullOrWhiteSpace(tokenValue))
        {
            return null;
        }

        var snapshot = await store.ReadAsync(cancellationToken);
        var token = snapshot.Tokens.FirstOrDefault(t => t.Value == tokenValue && t.ExpiresAtUtc > DateTime.UtcNow);
        if (token is null)
        {
            return null;
        }

        return snapshot.Users.FirstOrDefault(user => user.Id == token.UserId);
    }

    public static IResult UnauthorizedProblem() =>
        Results.Problem(
            title: "Unauthorized",
            detail: "A valid bearer token is required.",
            statusCode: StatusCodes.Status401Unauthorized,
            type: "https://httpstatuses.com/401");
}
