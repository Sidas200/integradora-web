package mx.utch.tdimp.api.controller;

import mx.utch.tdimp.api.exception.InvalidParameterException;

final class Slots {

  private Slots() {
  }

  static int check(int slot) {
    if (slot < 1 || slot > 3) {
      throw new InvalidParameterException("slot", "Range", "Must be between 1 and 3.");
    }
    return slot;
  }
}
