# 🔧 TROUBLESHOOTING - Appels

## ❌ Erreur : "L'utilisateur est déjà en appel"

### Cause
Un appel précédent n'a pas été terminé correctement et est toujours marqué comme actif dans la base de données.

### Solutions

#### Solution 1 : Via l'Interface (Recommandé)

1. Aller sur `/calls` (historique des appels)
2. Si un appel est marqué comme "En cours", cliquez dessus
3. Cliquez sur le bouton "Raccrocher" 📞❌
4. Retour automatique à l'historique
5. Réessayer l'appel

#### Solution 2 : Via Artisan Tinker (Rapide)

```bash
cd backend
php artisan tinker

# Terminer tous les appels actifs de User ID 1
>>> Call::where('caller_id', 1)->whereIn('status', ['calling', 'ringing', 'connected'])->update(['status' => 'ended', 'ended_at' => now()]);

# Ou terminer TOUS les appels actifs (si plusieurs users)
>>> Call::whereIn('status', ['calling', 'ringing', 'connected'])->update(['status' => 'ended', 'ended_at' => now()]);

# Vérifier
>>> Call::where('status', 'ended')->count();
```

#### Solution 3 : Via SQL Direct (Plus rapide)

```bash
cd backend
php artisan db

# MySQL
UPDATE calls SET status = 'ended', ended_at = NOW() WHERE status IN ('calling', 'ringing', 'connected');

# SQLite
UPDATE calls SET status = 'ended', ended_at = datetime('now') WHERE status IN ('calling', 'ringing', 'connected');
```

#### Solution 4 : Ajouter un Endpoint de Nettoyage

Créer un endpoint backend pour terminer automatiquement les appels zombies :

```php
// Dans CallController.php
public function cleanupStaleCall(Request $request)
{
    $user = Auth::user();
    
    // Terminer tous les appels actifs de cet utilisateur
    Call::where(function($q) use ($user) {
        $q->where('caller_id', $user->id)
          ->orWhere('receiver_id', $user->id);
    })
    ->whereIn('status', ['calling', 'ringing', 'connected'])
    ->update([
        'status' => 'failed',
        'ended_at' => now()
    ]);
    
    return response()->json(['message' => 'Appels nettoyés']);
}
```

Ajouter dans `routes/api.php` :
```php
Route::post('/calls/cleanup', [CallController::class, 'cleanupStaleCall']);
```

Puis dans le frontend :
```typescript
// Dans callsApi
async cleanupStaleCalls(token: string) {
  const response = await fetch(`${API_URL}/calls/cleanup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}
```

## 🛡️ Prévention

### Améliorer la Gestion des Erreurs dans CallButton

```typescript
// Dans components/CallButton.tsx
const handleCall = async () => {
  try {
    setCalling(true);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vous devez être connecté');
      return;
    }

    const response = await callsApi.initiateCall(token, {
      receiver_id: userId,
      type,
    });

    router.push(`/calls/${response.call.id}`);
  } catch (error: any) {
    console.error('Error initiating call:', error);
    
    // Si l'utilisateur est déjà en appel, proposer de nettoyer
    if (error.message.includes('déjà en appel')) {
      const cleanup = confirm(
        'Vous avez un appel en cours. Voulez-vous le terminer et rappeler ?'
      );
      
      if (cleanup) {
        try {
          await callsApi.cleanupStaleCalls(token);
          alert('Appel terminé. Vous pouvez rappeler maintenant.');
        } catch (cleanupError) {
          alert('Erreur lors du nettoyage. Essayez de terminer l\'appel manuellement.');
        }
      }
    } else {
      alert(error.message || 'Erreur lors de l\'appel');
    }
  } finally {
    setCalling(false);
  }
};
```

### Ajouter un Timeout Automatique

Modifier le backend pour terminer automatiquement les appels zombies :

```php
// Dans CallController.php - méthode initiateCall
public function initiateCall(Request $request)
{
    $user = Auth::user();
    
    // NOUVEAU : Nettoyer les appels zombies (> 5 minutes sans être connectés)
    Call::where(function($q) use ($user) {
        $q->where('caller_id', $user->id)
          ->orWhere('receiver_id', $user->id);
    })
    ->whereIn('status', ['calling', 'ringing'])
    ->where('created_at', '<', now()->subMinutes(5))
    ->update([
        'status' => 'failed',
        'ended_at' => now()
    ]);
    
    // Vérifier si l'utilisateur n'est pas en appel ACTIF
    if ($receiverId) {
        $activeCall = Call::where('receiver_id', $receiverId)
            ->whereIn('status', ['calling', 'ringing', 'connected'])
            ->where('created_at', '>', now()->subMinutes(5)) // Seulement les appels récents
            ->first();
        
        if ($activeCall) {
            return response()->json(['message' => 'L\'utilisateur est déjà en appel.'], 422);
        }
    }
    
    // ...existing code...
}
```

### Ajouter un Bouton "Forcer Nouveau Appel"

Dans l'interface, si un appel échoue, afficher un bouton pour forcer :

```tsx
// Dans CallButton.tsx
const [showForceOption, setShowForceOption] = useState(false);

const handleCall = async (force = false) => {
  try {
    // Si force, nettoyer d'abord
    if (force) {
      await callsApi.cleanupStaleCalls(token);
    }
    
    const response = await callsApi.initiateCall(token, {
      receiver_id: userId,
      type,
    });
    
    router.push(`/calls/${response.call.id}`);
  } catch (error: any) {
    if (error.message.includes('déjà en appel') && !force) {
      setShowForceOption(true);
    } else {
      alert(error.message);
    }
  }
};

return (
  <>
    <button onClick={() => handleCall(false)}>
      {calling ? '⏳' : icon}
    </button>
    
    {showForceOption && (
      <button 
        onClick={() => handleCall(true)}
        className="ml-2 text-sm text-red-600"
      >
        Forcer l'appel
      </button>
    )}
  </>
);
```

## 📋 Checklist de Debug

Quand vous rencontrez cette erreur :

1. [ ] Vérifier si vous avez un appel en cours sur `/calls`
2. [ ] Vérifier la console : Y a-t-il des erreurs réseau ?
3. [ ] Vérifier le backend : `Call::whereIn('status', ['calling', 'ringing'])->get()`
4. [ ] Terminer l'appel manuellement via l'interface
5. [ ] Si impossible, utiliser Artisan Tinker
6. [ ] Réessayer l'appel

## 🎯 Pour Tester Maintenant

**Option Rapide** (1 minute) :
```bash
cd backend
php artisan tinker
>>> Call::whereIn('status', ['calling', 'ringing', 'connected'])->update(['status' => 'ended', 'ended_at' => now()]);
>>> exit
```

Puis retournez sur l'interface et réessayez l'appel.

## 💡 Astuce

Si vous développez et testez souvent, créez une commande Artisan personnalisée :

```bash
php artisan make:command CleanupStaleCalls
```

```php
// app/Console/Commands/CleanupStaleCalls.php
public function handle()
{
    $count = Call::whereIn('status', ['calling', 'ringing', 'connected'])
        ->where('created_at', '<', now()->subMinutes(5))
        ->update(['status' => 'failed', 'ended_at' => now()]);
    
    $this->info("Terminé {$count} appel(s) zombie(s)");
}
```

Puis en développement :
```bash
php artisan calls:cleanup
```

---

**Temps de résolution : < 1 minute avec Solution 2** 🚀
