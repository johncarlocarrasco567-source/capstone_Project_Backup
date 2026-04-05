<?php

// app/Models/BranchCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchCategory extends Model
{
    protected $fillable = ['branch_id', 'category_id', 'is_active'];
    
    protected $casts = [
        'is_active' => 'boolean'
    ];
    
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}