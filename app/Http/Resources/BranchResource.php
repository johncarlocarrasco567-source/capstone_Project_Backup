<?php
// app/Http/Resources/BranchResource.php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'location' => $this->location,
            'type' => $this->type,
            'users_count' => $this->whenCounted('users'),
            'orders_count' => $this->whenCounted('orders'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}