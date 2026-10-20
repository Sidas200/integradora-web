package mx.utch.tdimp.api.dto;

public record PageQuery(int page, int size) {

  public static final int MAX_SIZE = 50;

  public long offset() {
    return (long) page * size;
  }
}
