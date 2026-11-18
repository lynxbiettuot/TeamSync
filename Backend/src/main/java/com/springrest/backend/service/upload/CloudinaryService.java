// Dịch vụ tải lên tệp tin và xử lý ảnh đại diện lên kho lưu trữ đám mây Cloudinary
package com.springrest.backend.service.upload;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final long MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

    public String uploadAvatar(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn tệp ảnh hợp lệ");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Kích thước ảnh tối đa là 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Định dạng ảnh không hỗ trợ (chấp nhận JPEG, PNG, WEBP, GIF)");
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "image"
                )
        );

        Object secureUrl = uploadResult.get("secure_url");
        if (secureUrl == null) {
            throw new RuntimeException("Không nhận được URL ảnh từ Cloudinary");
        }

        return secureUrl.toString();
    }

    public String uploadAttachment(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn tệp hợp lệ để tải lên");
        }

        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new IllegalArgumentException("Kích thước tệp đính kèm tối đa là 25MB");
        }

        String contentType = file.getContentType();
        boolean isImage = contentType != null && contentType.toLowerCase().startsWith("image/");
        String resourceType = isImage ? "image" : "raw";

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "file_" + System.currentTimeMillis();
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("folder", folder);
        params.put("resource_type", resourceType);

        if (!isImage) {
            String baseName = originalFilename;
            String extension = "";
            int lastDot = originalFilename.lastIndexOf('.');
            if (lastDot > 0 && lastDot < originalFilename.length() - 1) {
                baseName = originalFilename.substring(0, lastDot);
                extension = originalFilename.substring(lastDot);
            }
            String safeBaseName = baseName.replaceAll("[^a-zA-Z0-9_-]", "_");
            if (safeBaseName.isBlank()) {
                safeBaseName = "file";
            }
            String publicId = safeBaseName + "_" + System.currentTimeMillis() + extension;
            params.put("public_id", publicId);
        } else {
            params.put("use_filename", true);
            params.put("unique_filename", true);
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                params
        );

        Object secureUrl = uploadResult.get("secure_url");
        if (secureUrl == null) {
            throw new RuntimeException("Không nhận được URL tệp từ Cloudinary");
        }

        return secureUrl.toString();
    }
}
