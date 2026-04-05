<?php
// app/Models/Ingredient.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    protected $fillable = ['name', 'unit'];
    
    public function branchIngredients()
    {
        return $this->hasMany(BranchIngredient::class);
    }
    
    public function recipes()
    {
        return $this->hasMany(ProductRecipe::class);
    }
    
    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_ingredients')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_recipes')
                    ->withPivot('quantity_needed')
                    ->withTimestamps();
    }
}