using System.ComponentModel.DataAnnotations;

namespace Todo.Api.Contracts;

public sealed class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = string.Empty;

    [MaxLength(120)]
    public string? DisplayName { get; init; }
}

public sealed class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = string.Empty;
}

public sealed record AuthUserResponse(Guid Id, string Email, string? DisplayName);

public sealed record LoginResponse(string AccessToken, string TokenType, int ExpiresInSeconds, AuthUserResponse User);
