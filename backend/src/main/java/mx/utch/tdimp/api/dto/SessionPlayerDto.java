package mx.utch.tdimp.api.dto;

import java.util.UUID;

public record SessionPlayerDto(UUID id, String username, String email) {
}
