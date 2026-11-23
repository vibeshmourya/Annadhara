import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../storage/storage_service.dart';

class ApiResponse {
  final bool success;
  final String message;
  final dynamic data;
  final int statusCode;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    required this.statusCode,
  });
}

class ApiService {
  static const Duration _timeoutDuration = Duration(seconds: 30);

  static Future<Map<String, String>> _headers() async {
    final token = await StorageService.getToken();
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static String _formatException(dynamic e) {
    if (e is TimeoutException) {
      return 'Request timed out. The server may be warming up, please try again.';
    }
    if (e is SocketException) {
      return 'Unable to connect to Annadhara server. Please check your internet connection.';
    }
    if (e is http.ClientException) {
      return 'Network communication error. Please check your internet connection and try again.';
    }
    final str = e.toString();
    if (str.toLowerCase().contains('timeout')) {
      return 'Request timed out. The server may be warming up, please try again.';
    }
    if (str.toLowerCase().contains('socketexception') ||
        str.toLowerCase().contains('connection refused') ||
        str.toLowerCase().contains('failed host lookup')) {
      return 'Unable to connect to Annadhara server. Please check your internet connection.';
    }
    return str;
  }

  static Future<ApiResponse> get(String endpoint, {Map<String, String>? queryParams}) async {
    try {
      var uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      if (queryParams != null && queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }
      final response = await http
          .get(uri, headers: await _headers())
          .timeout(_timeoutDuration);
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: _formatException(e), statusCode: 500);
    }
  }

  static Future<ApiResponse> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http
          .post(
            uri,
            headers: await _headers(),
            body: jsonEncode(body),
          )
          .timeout(_timeoutDuration);
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: _formatException(e), statusCode: 500);
    }
  }

  static Future<ApiResponse> patch(String endpoint, Map<String, dynamic> body) async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http
          .patch(
            uri,
            headers: await _headers(),
            body: jsonEncode(body),
          )
          .timeout(_timeoutDuration);
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: _formatException(e), statusCode: 500);
    }
  }

  static Future<ApiResponse> put(String endpoint, Map<String, dynamic> body) async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http
          .put(
            uri,
            headers: await _headers(),
            body: jsonEncode(body),
          )
          .timeout(_timeoutDuration);
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: _formatException(e), statusCode: 500);
    }
  }

  static Future<ApiResponse> delete(String endpoint) async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final response = await http
          .delete(
            uri,
            headers: await _headers(),
          )
          .timeout(_timeoutDuration);
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: _formatException(e), statusCode: 500);
    }
  }

  static Future<ApiResponse> uploadImage(File file) async {
    try {
      final token = await StorageService.getToken();
      final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.uploadImage}');
      final request = http.MultipartRequest('POST', uri);

      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      final stream = http.ByteStream(file.openRead());
      final length = await file.length();
      final filename = file.path.split(Platform.pathSeparator).last;

      final multipartFile = http.MultipartFile(
        'image',
        stream,
        length,
        filename: filename,
      );
      request.files.add(multipartFile);

      final streamedResponse = await request.send().timeout(_timeoutDuration);
      final response = await http.Response.fromStream(streamedResponse);
      return _parseResponse(response);
    } catch (e) {
      return ApiResponse(success: false, message: _formatException(e), statusCode: 500);
    }
  }

  static ApiResponse _parseResponse(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      final bool success = decoded['success'] ?? (response.statusCode >= 200 && response.statusCode < 300);
      final String message = decoded['message'] ?? (success ? 'Success' : 'Request failed');
      final dynamic data = decoded['data'] ?? decoded;

      return ApiResponse(
        success: success,
        message: message,
        data: data,
        statusCode: response.statusCode,
      );
    } catch (e) {
      return ApiResponse(
        success: response.statusCode >= 200 && response.statusCode < 300,
        message: 'HTTP ${response.statusCode}',
        data: response.body,
        statusCode: response.statusCode,
      );
    }
  }
}
