package mx.utch.tdimp.api.repository;

import mx.utch.tdimp.api.model.LaunchSubscription;

public interface SubscriptionWriter {

  boolean insertIfAbsent(LaunchSubscription subscription);
}
