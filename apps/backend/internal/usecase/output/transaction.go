package output

import "errors"

var ErrInvalidTransaction = errors.New("invalid transaction")

type Transaction interface {
	StartTransaction(func(interface{}) error) error
}
