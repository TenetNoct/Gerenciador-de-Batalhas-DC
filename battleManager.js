const battles = new Map();

function setBattle(message) {
  const battleDetails = message.content.slice(10).trim();
  const [team1, team2] = battleDetails.split("vs").map((team) => team.trim());
  const team1Chars = team1.split(",").map((char) => {
    const [name, life] = char.split(":");
    return {
      name: name.trim(),
      life: parseInt(life.trim()),
      maxHealth: parseInt(life.trim()),
    };
  });
  const team2Chars = team2.split(",").map((char) => {
    const [name, life] = char.split(":");
    return {
      name: name.trim(),
      life: parseInt(life.trim()),
      maxHealth: parseInt(life.trim()),
    };
  });
  const battleId = message.channel.id; // Use channel ID as battle ID
  battles.set(battleId, { team1: team1Chars, team2: team2Chars });
  message.channel.send(formatBattleStatus(battleId));
}

function applyDamage(message) {
  const [_, name, damage] = message.content.split(" ");
  modifyLife(name, -parseInt(damage), message);
}

function applyHeal(message) {
  const [_, name, heal] = message.content.split(" ");
  modifyLife(name, parseInt(heal), message);
}

function applyDamageAll(message) {
  const [_, team, damage] = message.content.split(" ");
  modifyLifeAll(team, -parseInt(damage), message);
}

function applyHealAll(message) {
  const [_, team, heal] = message.content.split(" ");
  modifyLifeAll(team, parseInt(heal), message);
}

function applyMaxDamage(message) {
  const [_, name] = message.content.split(" ");
  modifyLife(name, -Infinity, message);
}

function applyMaxHeal(message) {
  const [_, name] = message.content.split(" ");
  healToMax(name, message);
}

function applyMaxDamageAll(message) {
  const [_, team] = message.content.split(" ");
  modifyLifeAll(team, -Infinity, message);
}

function applyMaxHealAll(message) {
  const [_, team] = message.content.split(" ");
  healAllToMax(team, message);
}

function endBattle(message) {
  const battleId = message.channel.id;
  if (battles.has(battleId)) {
    const { winner, status } = checkBattleEnd(battleId);
    message.channel.send(status);
    battles.delete(battleId);
  } else {
    message.channel.send("Nenhuma batalha ativa encontrada.");
  }
}

function modifyLife(name, amount, message) {
  for (const [battleId, battle] of battles) {
    let updated = false;
    battle.team1.concat(battle.team2).forEach((char) => {
      if (char.name === name) {
        char.life += amount;
        if (char.life < 0) char.life = 0;
        if (amount < -50) {
          message.channel.send(
            `**Golpe Crítico!** ${char.name} recebeu ${-amount} de dano!`,
          );
        }
        updated = true;
      }
    });
    if (updated) {
      const { winner, status } = checkBattleEnd(battleId);
      message.channel.send(formatBattleStatus(battleId));
      if (winner) {
        message.channel.send(status);
        battles.delete(battleId);
      }
      return;
    }
  }
  message.channel.send(`Personagem ${name} não encontrado.`);
}

function healToMax(name, message) {
  for (const [battleId, battle] of battles) {
    let updated = false;
    battle.team1.concat(battle.team2).forEach((char) => {
      if (char.name === name) {
        char.life = char.maxHealth;
        updated = true;
      }
    });
    if (updated) {
      message.channel.send(formatBattleStatus(battleId));
      return;
    }
  }
  message.channel.send(`Personagem ${name} não encontrado.`);
}

function healAllToMax(team, message) {
  for (const [battleId, battle] of battles) {
    let updated = false;
    if (team === "team1") {
      battle.team1.forEach((char) => {
        char.life = char.maxHealth;
        updated = true;
      });
    } else if (team === "team2") {
      battle.team2.forEach((char) => {
        char.life = char.maxHealth;
        updated = true;
      });
    }
    if (updated) {
      message.channel.send(formatBattleStatus(battleId));
      return;
    }
  }
  message.channel.send(`Time ${team} não encontrado.`);
}

function modifyLifeAll(team, amount, message) {
  for (const [battleId, battle] of battles) {
    let updated = false;
    if (team === "team1") {
      battle.team1.forEach((char) => {
        char.life += amount;
        if (char.life < 0) char.life = 0;
        updated = true;
      });
    } else if (team === "team2") {
      battle.team2.forEach((char) => {
        char.life += amount;
        if (char.life < 0) char.life = 0;
        updated = true;
      });
    }
    if (updated) {
      const { winner, status } = checkBattleEnd(battleId);
      message.channel.send(formatBattleStatus(battleId));
      if (winner) {
        message.channel.send(status);
        battles.delete(battleId);
      }
      return;
    }
  }
  message.channel.send(`Time ${team} não encontrado.`);
}

function findBattleIdByMessage(message) {
  return message.channel.id;
}

function checkBattleEnd(battleId) {
  const battle = battles.get(battleId);
  if (!battle) return { winner: false, status: "Nenhuma batalha encontrada." };

  const team1Alive = battle.team1.some((char) => char.life > 0);
  const team2Alive = battle.team2.some((char) => char.life > 0);

  if (!team1Alive && !team2Alive) {
    return {
      winner: true,
      status: `A batalha ${battleId} terminou em empate!`,
    };
  } else if (!team1Alive) {
    return {
      winner: true,
      status: `**A batalha ${battleId} terminou!** Time 2 venceu!\n~~${battle.team1.map((char) => char.name).join(", ")}~~`,
    };
  } else if (!team2Alive) {
    return {
      winner: true,
      status: `**A batalha ${battleId} terminou!** Time 1 venceu!\n~~${battle.team2.map((char) => char.name).join(", ")}~~`,
    };
  }
  return { winner: false, status: "A batalha ainda está em andamento." };
}

function formatBattleStatus(battleId) {
  const battle = battles.get(battleId);
  if (!battle) return "Nenhuma batalha encontrada.";
  const team1Status = battle.team1
    .map(
      (char) =>
        `${char.name}: ${char.life} (atual) / ${char.maxHealth} (máx) HP`,
    )
    .join(", ");
  const team2Status = battle.team2
    .map(
      (char) =>
        `${char.name}: ${char.life} (atual) / ${char.maxHealth} (máx) HP`,
    )
    .join(", ");
  return `**Batalha ${battleId}**\n**Time 1:** ${team1Status}\n**Time 2:** ${team2Status}`;
}

function showHelp(message) {
  const helpMessage = `
**Guia do Bot de Batalha**
Comandos disponíveis:
1. **/setbattle <personagem1>:<vida1>,<personagem2>:<vida2> vs <personagem3>:<vida3>** - Configura uma nova batalha entre duas equipes.
2. **/d <nome_do_personagem> <dano>** - Aplica dano a um personagem.
3. **/h <nome_do_personagem> <cura>** - Cura um personagem.
4. **/ad <team1|team2> <dano>** - Aplica dano a todos os membros de um time.
5. **/ah <team1|team2> <cura>** - Cura todos os membros de um time.
6. **/md <nome_do_personagem>** - Mata um personagem instantaneamente.
7. **/mh <nome_do_personagem>** - Cura um personagem até a vida máxima.
8. **/amd <team1|team2>** - Mata instantaneamente todos os membros de um time.
9. **/amh <team1|team2>** - Cura todos os membros de um time até a vida máxima.
10. **/eb** - Termina a batalha atual.
11. **/help** - Mostra este guia de ajuda.

Exemplos:
- /setbattle Benimaru:10000,Lucia:5000 vs HellBoy:18000
- /d Benimaru 500
- /h Lucia 300
- /ad team1 200
- /md HellBoy
- /mh Benimaru
- /eb

Se precisar de mais ajuda, pergunte a um administrador.
  `;
  message.channel.send(helpMessage);
}

module.exports = {
  setBattle,
  applyDamage,
  applyHeal,
  applyDamageAll,
  applyHealAll,
  applyMaxDamage,
  applyMaxHeal,
  applyMaxDamageAll,
  applyMaxHealAll,
  endBattle,
  showHelp,
};
