<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Category;

class BranchCategorySeeder extends Seeder
{
    public function run()
    {
        $branches = Branch::all();
        $categories = Category::all();
        
        foreach ($branches as $branch) {
            // Assign all existing categories to each branch
            foreach ($categories as $category) {
                $branch->categories()->attach($category->id, ['is_active' => true]);
            }
        }
    }
}