using System.ComponentModel.DataAnnotations;

namespace Todo.Api.Services;

public static class RequestValidationExtensions
{
    public static Dictionary<string, string[]> ValidateObject<T>(this T model)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(model!);
        Validator.TryValidateObject(model!, context, results, validateAllProperties: true);

        return results
            .SelectMany(result =>
            {
                var names = result.MemberNames.Any() ? result.MemberNames : ["request"];
                return names.Select(name => new KeyValuePair<string, string>(name, result.ErrorMessage ?? "Invalid value."));
            })
            .GroupBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Select(pair => pair.Value).Distinct().ToArray(), StringComparer.OrdinalIgnoreCase);
    }
}
