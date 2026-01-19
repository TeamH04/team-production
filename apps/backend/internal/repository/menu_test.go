package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// setupMenuTest creates common test dependencies for menu tests
func setupMenuTest(t *testing.T) (*gorm.DB, output.MenuRepository, output.StoreRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)

	menuRepo := repository.NewMenuRepository(db)
	storeRepo := repository.NewStoreRepository(db)

	t.Cleanup(func() {
		testutil.CleanupTestDB(t, db)
	})

	return db, menuRepo, storeRepo
}

// newTestMenuStore creates a test store for menu tests
func newTestMenuStore(t *testing.T) *entity.Store {
	t.Helper()
	return &entity.Store{
		StoreID:   "store-" + uuid.New().String()[:8],
		Name:      "Test Store for Menu",
		Address:   "Test Address",
		Latitude:  35.6812,
		Longitude: 139.7671,
		PlaceID:   "place-" + uuid.New().String()[:8],
		Category:  "カフェ・喫茶",
		Budget:    "$$",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// newTestMenuEntity creates a test menu entity
func newTestMenuEntity(t *testing.T, storeID string, overrides ...func(*entity.Menu)) *entity.Menu {
	t.Helper()
	price := 500
	description := "Test menu description"
	menu := &entity.Menu{
		MenuID:      "menu-" + uuid.New().String()[:8],
		StoreID:     storeID,
		Name:        "Test Menu " + uuid.New().String()[:8],
		Price:       &price,
		Description: &description,
	}
	for _, fn := range overrides {
		fn(menu)
	}
	return menu
}

// TestMenuRepository_Create_Success tests creating a menu
func TestMenuRepository_Create_Success(t *testing.T) {
	db, menuRepo, storeRepo := setupMenuTest(t)

	// Create store
	store := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create menu - note: SQLite doesn't auto-generate UUIDs like PostgreSQL,
	// so MenuID won't be populated. This test verifies Create doesn't error.
	menu := newTestMenuEntity(t, store.StoreID)
	err := menuRepo.Create(context.Background(), menu)
	require.NoError(t, err)

	// Verify the menu was created by checking DB directly
	var count int64
	err = db.Table("menus").Where("store_id = ?", store.StoreID).Count(&count).Error
	require.NoError(t, err)
	require.Equal(t, int64(1), count)
}

// TestMenuRepository_Create_WithNilPrice tests creating a menu without price
func TestMenuRepository_Create_WithNilPrice(t *testing.T) {
	db, menuRepo, storeRepo := setupMenuTest(t)

	// Create store
	store := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create menu without price
	menu := newTestMenuEntity(t, store.StoreID, func(m *entity.Menu) {
		m.Price = nil
	})
	err := menuRepo.Create(context.Background(), menu)
	require.NoError(t, err)

	// Verify the menu was created by checking DB directly
	var count int64
	err = db.Table("menus").Where("store_id = ?", store.StoreID).Count(&count).Error
	require.NoError(t, err)
	require.Equal(t, int64(1), count)
}

// TestMenuRepository_FindByStoreID_Success tests finding menus by store ID
func TestMenuRepository_FindByStoreID_Success(t *testing.T) {
	_, menuRepo, storeRepo := setupMenuTest(t)

	// Create store
	store := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create menus
	menu1 := newTestMenuEntity(t, store.StoreID, func(m *entity.Menu) {
		m.Name = "Menu 1"
	})
	menu2 := newTestMenuEntity(t, store.StoreID, func(m *entity.Menu) {
		m.Name = "Menu 2"
	})
	require.NoError(t, menuRepo.Create(context.Background(), menu1))
	require.NoError(t, menuRepo.Create(context.Background(), menu2))

	// Find by store ID
	menus, err := menuRepo.FindByStoreID(context.Background(), store.StoreID)
	require.NoError(t, err)
	require.Len(t, menus, 2)
}

// TestMenuRepository_FindByStoreID_Empty tests finding menus for a store with no menus
func TestMenuRepository_FindByStoreID_Empty(t *testing.T) {
	_, menuRepo, storeRepo := setupMenuTest(t)

	// Create store without menus
	store := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Find by store ID
	menus, err := menuRepo.FindByStoreID(context.Background(), store.StoreID)
	require.NoError(t, err)
	require.Empty(t, menus)
}

// TestMenuRepository_FindByStoreID_OrderByCreatedAtDesc tests menus are ordered by created_at desc
func TestMenuRepository_FindByStoreID_OrderByCreatedAtDesc(t *testing.T) {
	_, menuRepo, storeRepo := setupMenuTest(t)

	// Create store
	store := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create menus
	menu1 := newTestMenuEntity(t, store.StoreID, func(m *entity.Menu) {
		m.Name = "First Menu"
	})
	require.NoError(t, menuRepo.Create(context.Background(), menu1))

	menu2 := newTestMenuEntity(t, store.StoreID, func(m *entity.Menu) {
		m.Name = "Second Menu"
	})
	require.NoError(t, menuRepo.Create(context.Background(), menu2))

	// Find by store ID - should be ordered by created_at desc (newest first)
	menus, err := menuRepo.FindByStoreID(context.Background(), store.StoreID)
	require.NoError(t, err)
	require.Len(t, menus, 2)
	// Second menu (created later) should come first
	require.Equal(t, "Second Menu", menus[0].Name)
	require.Equal(t, "First Menu", menus[1].Name)
}

// TestMenuRepository_FindByStoreAndIDs_Success tests finding menus by store and IDs
func TestMenuRepository_FindByStoreAndIDs_Success(t *testing.T) {
	db, menuRepo, storeRepo := setupMenuTest(t)

	// Create store
	store := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create menus directly in DB with known IDs (since SQLite doesn't auto-generate UUIDs)
	menuID1 := "menu-" + uuid.New().String()[:8]
	menuID2 := "menu-" + uuid.New().String()[:8]
	menuID3 := "menu-" + uuid.New().String()[:8]

	require.NoError(t, db.Exec("INSERT INTO menus (menu_id, store_id, name, created_at) VALUES (?, ?, ?, ?)",
		menuID1, store.StoreID, "Menu 1", time.Now()).Error)
	require.NoError(t, db.Exec("INSERT INTO menus (menu_id, store_id, name, created_at) VALUES (?, ?, ?, ?)",
		menuID2, store.StoreID, "Menu 2", time.Now()).Error)
	require.NoError(t, db.Exec("INSERT INTO menus (menu_id, store_id, name, created_at) VALUES (?, ?, ?, ?)",
		menuID3, store.StoreID, "Menu 3", time.Now()).Error)

	// Find by store and IDs (only menu1 and menu3)
	menus, err := menuRepo.FindByStoreAndIDs(context.Background(), store.StoreID, []string{menuID1, menuID3})
	require.NoError(t, err)
	require.Len(t, menus, 2)
}

// TestMenuRepository_FindByStoreAndIDs_EmptyIDs tests finding menus with empty ID list
func TestMenuRepository_FindByStoreAndIDs_EmptyIDs(t *testing.T) {
	_, menuRepo, storeRepo := setupMenuTest(t)

	// Create store
	store := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Find with empty IDs - should return nil without error
	menus, err := menuRepo.FindByStoreAndIDs(context.Background(), store.StoreID, []string{})
	require.NoError(t, err)
	require.Nil(t, menus)
}

// TestMenuRepository_FindByStoreAndIDs_NotInStore tests finding menus that don't belong to the store
func TestMenuRepository_FindByStoreAndIDs_NotInStore(t *testing.T) {
	db, menuRepo, storeRepo := setupMenuTest(t)

	// Create two stores
	store1 := newTestMenuStore(t)
	store2 := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store1))
	require.NoError(t, storeRepo.Create(context.Background(), store2))

	// Create menu in store1 directly in DB
	menuID := "menu-" + uuid.New().String()[:8]
	require.NoError(t, db.Exec("INSERT INTO menus (menu_id, store_id, name, created_at) VALUES (?, ?, ?, ?)",
		menuID, store1.StoreID, "Menu 1", time.Now()).Error)

	// Try to find menu using store2's ID - should not find it
	menus, err := menuRepo.FindByStoreAndIDs(context.Background(), store2.StoreID, []string{menuID})
	require.NoError(t, err)
	require.Empty(t, menus)
}

// TestMenuRepository_FindByStoreAndIDs_PartialMatch tests finding menus with partial match
func TestMenuRepository_FindByStoreAndIDs_PartialMatch(t *testing.T) {
	db, menuRepo, storeRepo := setupMenuTest(t)

	// Create store
	store := newTestMenuStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create menu directly in DB
	menuID := "menu-" + uuid.New().String()[:8]
	require.NoError(t, db.Exec("INSERT INTO menus (menu_id, store_id, name, created_at) VALUES (?, ?, ?, ?)",
		menuID, store.StoreID, "Test Menu", time.Now()).Error)

	nonexistentID := "menu-" + uuid.New().String()[:8]

	// Find with mix of existing and non-existing IDs
	menus, err := menuRepo.FindByStoreAndIDs(context.Background(), store.StoreID, []string{menuID, nonexistentID})
	require.NoError(t, err)
	require.Len(t, menus, 1)
	require.Equal(t, menuID, menus[0].MenuID)
}
