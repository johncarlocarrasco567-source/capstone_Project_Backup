<?php
// app/Models/Category.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name'];
    
    public function products()
    {
        return $this->hasMany(Product::class);
    }
    // app/Models/Category.php

// Add this relationship
public function branches()
{
    return $this->belongsToMany(Branch::class, 'branch_category')
                ->withPivot('is_active')
                ->withTimestamps();
}
}