using System;
using System.Text.RegularExpressions;

namespace CACC.Entities
{
    public static partial class CategoriaIdentity
    {
        public static string NormalizeName(string? name) =>
            Whitespace().Replace(name?.Trim() ?? string.Empty, " ");

        [GeneratedRegex(@"\s+")]
        private static partial Regex Whitespace();
    }

    public sealed class CategoriaDuplicadaException : InvalidOperationException
    {
        public CategoriaDuplicadaException(Exception? innerException = null)
            : base("Ya existe una categoría con el mismo nombre.", innerException)
        {
        }
    }
}
