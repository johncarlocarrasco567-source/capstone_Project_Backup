<?php
// app/Models/BranchIngredient.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchIngredient extends Model
{
    protected $fillable = ['branch_id', 'ingredient_id', 'quantity'];
    
    protected $casts = [
        'quantity' => 'decimal:2'
    ];
    
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
}