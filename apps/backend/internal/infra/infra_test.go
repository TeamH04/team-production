package infra

import (
	"go/doc"
	"go/parser"
	"go/token"
	"strings"
	"testing"
)

func TestPackageDocumentation(t *testing.T) {
	fset := token.NewFileSet()
	pkgs, err := parser.ParseDir(fset, ".", nil, parser.ParseComments)
	if err != nil {
		t.Fatalf("failed to parse package: %v", err)
	}

	pkg, ok := pkgs["infra"]
	if !ok {
		t.Fatal("package infra not found")
	}

	d := doc.New(pkg, ".", 0)
	if d.Doc == "" {
		t.Error("package documentation should not be empty")
	}

	if !strings.Contains(d.Doc, "インフラストラクチャ層") {
		t.Error("package documentation should describe infrastructure layer")
	}
}
