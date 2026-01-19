package output

import (
	"testing"
)

func TestTransaction(t *testing.T) {
	// Transaction is an interface, so we just verify the type exists
	// The actual implementation is tested elsewhere
	var _ Transaction = nil
}

func TestErrInvalidTransaction(t *testing.T) {
	if ErrInvalidTransaction == nil {
		t.Error("ErrInvalidTransaction should not be nil")
	}
	if ErrInvalidTransaction.Error() != "invalid transaction" {
		t.Errorf("ErrInvalidTransaction.Error() = %q, want %q", ErrInvalidTransaction.Error(), "invalid transaction")
	}
}
