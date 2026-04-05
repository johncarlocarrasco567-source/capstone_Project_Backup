<?php
// app/Models/Report.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'branch_id', 'admin_id', 'type', 'title', 'description', 
        'response', 'status', 'priority'
    ];
    
    protected $casts = [
        'type' => 'string',
        'status' => 'string',
        'priority' => 'string',
    ];
    
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
    
    public function isPending()
    {
        return $this->status === 'pending';
    }
    
    public function isApproved()
    {
        return $this->status === 'approved';
    }
    
    public function isRejected()
    {
        return $this->status === 'rejected';
    }
    
    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
    
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }
    
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeForBranch($query, $branchId)
{
    return $query->where('branch_id', $branchId);
}

public function scopeApproved($query)
{
    return $query->where('status', 'approved');
}

public function scopeRejected($query)
{
    return $query->where('status', 'rejected');
}
}