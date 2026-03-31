using Todo.Api.Contracts;
using Todo.Api.Models;

namespace Todo.Api.Services;

public static class TodoMappingExtensions
{
    public static TodoResponse ToResponse(this TodoRecord todo) =>
        new(
            todo.Id,
            todo.Title,
            todo.Details,
            todo.Priority,
            todo.DueDate,
            todo.IsCompleted,
            todo.IsPublic,
            todo.CreatedAtUtc,
            todo.UpdatedAtUtc);
}
