namespace Todo.Api.Contracts;

public sealed class TodoQueryParameters
{
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 10;

    public string? Search { get; init; }

    public string? Status { get; init; } = "all";

    public string? Priority { get; init; }

    public string? SortBy { get; init; } = "createdAt";

    public string? SortDir { get; init; } = "desc";
}
