<?php

namespace App\Console\Commands;

use App\Models\Call;
use Illuminate\Console\Command;

class CleanupStaleCalls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'calls:cleanup {--minutes=5 : Appels de plus de X minutes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Terminer automatiquement les appels zombies (calling/ringing/connected depuis trop longtemps)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $minutes = (int) $this->option('minutes');
        
        $this->info("🔍 Recherche des appels zombies (> {$minutes} minutes)...");
        
        // Compter les appels zombies
        $count = Call::whereIn('status', ['calling', 'ringing', 'connected'])
            ->where('created_at', '<', now()->subMinutes($minutes))
            ->count();
        
        if ($count === 0) {
            $this->info('✅ Aucun appel zombie trouvé.');
            return Command::SUCCESS;
        }
        
        $this->warn("⚠️  Trouvé {$count} appel(s) zombie(s)");
        
        // Terminer les appels
        $updated = Call::whereIn('status', ['calling', 'ringing', 'connected'])
            ->where('created_at', '<', now()->subMinutes($minutes))
            ->update([
                'status' => 'failed',
                'ended_at' => now()
            ]);
        
        $this->info("✅ Terminé {$updated} appel(s) zombie(s)");
        
        // Afficher les détails
        $this->table(
            ['Statut', 'Avant', 'Après'],
            [
                ['Zombies', $count, 0],
                ['Terminés', '-', $updated],
            ]
        );
        
        return Command::SUCCESS;
    }
}

