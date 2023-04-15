module.exports = {
    commandsList: [
        {
            name: 'ping',
            description: 'Répond Pong!',
        },
        {
            name: 'players',
            description: 'Affiche la liste des joueurs connectés au serveur minecraft',
        },
        {
            name: 'stats',
            description: 'Affiche le top 5 des mots que tu as le plus utilisé',
        },
        {
            name: 'help',
            description: 'Affiche la liste des commandes',
        },
        {
            name: 'roll',
            description: 'Répond un nombre entre 0 et le nombre spécifié (vide = 10)',
            options: [
                {
                    name: 'int',
                    description: 'chiffre ou nombre',
                    type: 4,
                    required: false,
                },
            ],
        },
        {
            name: 'source',
            description: 'Affiche le lien vers le code source du bot',
        },
    ]
}