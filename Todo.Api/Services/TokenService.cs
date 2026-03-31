using System.Security.Cryptography;

namespace Todo.Api.Services;

public sealed class TokenService
{
    public const int ExpiresInSeconds = 3600;

    public string GenerateAccessToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(48);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}
