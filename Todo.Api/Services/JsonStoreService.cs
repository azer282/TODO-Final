using System.Text.Json;
using Todo.Api.Models;

namespace Todo.Api.Services;

public sealed class JsonStoreService
{
    private readonly SemaphoreSlim _mutex = new(1, 1);
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };
    private readonly string _storePath;

    public JsonStoreService(IHostEnvironment environment)
    {
        var dataDirectory = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(dataDirectory);
        _storePath = Path.Combine(dataDirectory, "store.json");
    }

    public async Task<AppStore> ReadAsync(CancellationToken cancellationToken = default)
    {
        await _mutex.WaitAsync(cancellationToken);
        try
        {
            return await ReadUnsafeAsync(cancellationToken);
        }
        finally
        {
            _mutex.Release();
        }
    }

    public async Task<TResult> MutateAsync<TResult>(Func<AppStore, TResult> mutation, CancellationToken cancellationToken = default)
    {
        await _mutex.WaitAsync(cancellationToken);
        try
        {
            var store = await ReadUnsafeAsync(cancellationToken);
            var result = mutation(store);
            await SaveUnsafeAsync(store, cancellationToken);
            return result;
        }
        finally
        {
            _mutex.Release();
        }
    }

    private async Task<AppStore> ReadUnsafeAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_storePath))
        {
            var empty = new AppStore();
            await SaveUnsafeAsync(empty, cancellationToken);
            return empty;
        }

        await using var stream = File.OpenRead(_storePath);
        var store = await JsonSerializer.DeserializeAsync<AppStore>(stream, _jsonOptions, cancellationToken);
        return store ?? new AppStore();
    }

    private async Task SaveUnsafeAsync(AppStore store, CancellationToken cancellationToken)
    {
        var tempPath = $"{_storePath}.tmp";
        await using (var stream = File.Create(tempPath))
        {
            await JsonSerializer.SerializeAsync(stream, store, _jsonOptions, cancellationToken);
        }

        File.Move(tempPath, _storePath, overwrite: true);
    }
}
