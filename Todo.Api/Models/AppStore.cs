namespace Todo.Api.Models;

public sealed class AppStore
{
    public List<UserRecord> Users { get; init; } = [];

    public List<TodoRecord> Todos { get; init; } = [];

    public List<TokenRecord> Tokens { get; init; } = [];
}
