<?php
// app/Models/ProductRecipe.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductRecipe extends Model
{
    protected $fillable = ['product_id', 'ingredient_id', 'quantity_needed'];
    
    protected $casts = [
        'quantity_needed' => 'decimal:2'
    ];
    
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    
    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
}