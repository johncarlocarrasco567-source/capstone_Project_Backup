<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed roles
        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'Super Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'Staff', 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Seed categories
        DB::table('categories')->insert([
            ['id' => 1, 'name' => 'Beverages', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Food', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'Desserts', 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Seed ingredients
        DB::table('ingredients')->insert([
            ['id' => 1, 'name' => 'Coffee Beans', 'unit' => 'grams', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Milk', 'unit' => 'ml', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'Sugar', 'unit' => 'grams', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'Flour', 'unit' => 'grams', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'name' => 'Eggs', 'unit' => 'pcs', 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Seed branches
        DB::table('branches')->insert([
            [
                'id' => 1,
                'name' => 'Main Branch',
                'location' => '123 Main St, City',
                'type' => 'company',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 2,
                'name' => 'Downtown Branch',
                'location' => '456 Downtown Ave, City',
                'type' => 'company',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 3,
                'name' => 'Mall Franchise',
                'location' => '789 Mall Road, City',
                'type' => 'franchise',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ]);
        
        // Seed users
        DB::table('users')->insert([
            [
                'id' => 1,
                'branch_id' => 1,
                'role_id' => 1,
                'name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 2,
                'branch_id' => 1,
                'role_id' => 2,
                'name' => 'Main Branch Admin',
                'email' => 'admin@mainbranch.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 3,
                'branch_id' => 1,
                'role_id' => 3,
                'name' => 'John Staff',
                'email' => 'staff@mainbranch.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now()
            ],
        ]);
        
        // Seed branch ingredients
        DB::table('branch_ingredients')->insert([
            ['branch_id' => 1, 'ingredient_id' => 1, 'quantity' => 5000, 'created_at' => now(), 'updated_at' => now()],
            ['branch_id' => 1, 'ingredient_id' => 2, 'quantity' => 10000, 'created_at' => now(), 'updated_at' => now()],
            ['branch_id' => 1, 'ingredient_id' => 3, 'quantity' => 2000, 'created_at' => now(), 'updated_at' => now()],
            ['branch_id' => 2, 'ingredient_id' => 1, 'quantity' => 3000, 'created_at' => now(), 'updated_at' => now()],
            ['branch_id' => 2, 'ingredient_id' => 2, 'quantity' => 8000, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Seed products
        DB::table('products')->insert([
            [
                'id' => 1,
                'category_id' => 1,
                'name' => 'Espresso',
                'price' => 3.50,
                'type' => 'ingredient_based',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 2,
                'category_id' => 1,
                'name' => 'Latte',
                'price' => 4.50,
                'type' => 'ingredient_based',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 3,
                'category_id' => 2,
                'name' => 'Sandwich',
                'price' => 5.00,
                'type' => 'stock_based',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ]);
        
        // Seed product recipes
        DB::table('product_recipes')->insert([
            ['product_id' => 1, 'ingredient_id' => 1, 'quantity_needed' => 18, 'created_at' => now(), 'updated_at' => now()],
            ['product_id' => 1, 'ingredient_id' => 3, 'quantity_needed' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['product_id' => 2, 'ingredient_id' => 1, 'quantity_needed' => 18, 'created_at' => now(), 'updated_at' => now()],
            ['product_id' => 2, 'ingredient_id' => 2, 'quantity_needed' => 200, 'created_at' => now(), 'updated_at' => now()],
            ['product_id' => 2, 'ingredient_id' => 3, 'quantity_needed' => 10, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Seed branch products
        DB::table('branch_products')->insert([
            ['branch_id' => 1, 'product_id' => 1, 'is_available' => true, 'created_at' => now(), 'updated_at' => now()],
            ['branch_id' => 1, 'product_id' => 2, 'is_available' => true, 'created_at' => now(), 'updated_at' => now()],
            ['branch_id' => 1, 'product_id' => 3, 'is_available' => true, 'created_at' => now(), 'updated_at' => now()],
            ['branch_id' => 2, 'product_id' => 1, 'is_available' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Seed product stocks
        DB::table('product_stocks')->insert([
            ['branch_id' => 1, 'product_id' => 3, 'quantity' => 20, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}