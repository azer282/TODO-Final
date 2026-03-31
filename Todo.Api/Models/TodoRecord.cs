namespace Todo.Api.Models;

public sealed class TodoRecord
{
    public Guid Id { get; init; }

    public Guid OwnerId { get; init; }

    public string Title { get; set; } = string.Empty;

    public string Details { get; set; } = string.Empty;

    public string Priority { get; set; } = "medium";

    public DateOnly? DueDate { get; set; }

    public bool IsCompleted { get; set; }

    public bool IsPublic { get; set; }

    public DateTime CreatedAtUtc { get; init; }

    public DateTime UpdatedAtUtc { get; set; }
}
