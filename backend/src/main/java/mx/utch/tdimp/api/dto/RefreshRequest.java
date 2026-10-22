package mx.utch.tdimp.api.dto;

import jakarta.validation.constraints.Size;

public record RefreshRequest(@Size(min = 43, max = 64) String refreshToken) {
}
