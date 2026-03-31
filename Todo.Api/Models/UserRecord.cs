namespace Todo.Api.Models;

public sealed class UserRecord
{
    public Guid Id { get; init; }

    public string Email { get; init; } = string.Empty;

    public string PasswordHash { get; init; } = string.Empty;

    public string PasswordSalt { get; init; } = string.Empty;

    public string? DisplayName { get; init; }

    public DateTime CreatedAtUtc { get; init; }
}
