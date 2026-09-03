using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Inventario.API.Common.Security;

public static class AesEncryptionHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static (string Payload, string Iv) EncryptObject<T>(T data, string secretKey)
    {
        var json = JsonSerializer.Serialize(data, JsonOptions);
        return EncryptString(json, secretKey);
    }

    public static (string Payload, string Iv) EncryptString(string plainText, string secretKey)
    {
        byte[] keyBytes;
        using (var sha = SHA256.Create())
        {
            keyBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(secretKey));
        }

        byte[] ivBytes = new byte[16];
        RandomNumberGenerator.Fill(ivBytes);

        using var aes = Aes.Create();
        aes.Key = keyBytes;
        aes.IV = ivBytes;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
        byte[] encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        string payloadBase64 = Convert.ToBase64String(encryptedBytes);
        string ivHex = Convert.ToHexString(ivBytes).ToLowerInvariant();

        return (payloadBase64, ivHex);
    }

    public static T? DecryptObject<T>(string payloadBase64, string ivHex, string secretKey)
    {
        var json = DecryptString(payloadBase64, ivHex, secretKey);
        return JsonSerializer.Deserialize<T>(json, JsonOptions);
    }

    public static string DecryptString(string payloadBase64, string ivHex, string secretKey)
    {
        byte[] keyBytes;
        using (var sha = SHA256.Create())
        {
            keyBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(secretKey));
        }

        byte[] ivBytes = Convert.FromHexString(ivHex);
        byte[] encryptedBytes = Convert.FromBase64String(payloadBase64);

        using var aes = Aes.Create();
        aes.Key = keyBytes;
        aes.IV = ivBytes;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        byte[] decryptedBytes = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);

        return Encoding.UTF8.GetString(decryptedBytes);
    }
}
