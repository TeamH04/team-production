package role

const (
	Admin = "admin"
	Owner = "owner"
	User  = "user"
)

// RequireRole で使用するロールの組み合わせ
var (
	OwnerOrAdmin = []string{Owner, Admin}
)
