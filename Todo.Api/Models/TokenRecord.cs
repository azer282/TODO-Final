namespace Todo.Api.Models;

public sealed class TokenRecord
{
    public string Value { get; init; } = string.Empty;

    public Guid UserId { get; init; }

    public DateTime ExpiresAtUtc { get; init; }

    public DateTime CreatedAtUtc { get; init; }
}
