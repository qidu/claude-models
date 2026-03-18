    // If successful, start claude
    await this.startClaude();
    
    // Show final summary
    console.log('\n' + chalk.bold.green('=== Summary ==='));
    console.log(chalk.cyan('Config file updated with:'));
    console.log(chalk.cyan('  ✓ Selected lines kept without # prefix'));
    console.log(chalk.cyan('  ✓ Unselected lines prefixed with # (one at most)'));
    console.log(chalk.cyan('  ✓ TIMEOUT included as selectable choice'));
  }
}

// Run the TUI
const tui = new EnhancedClaudeModelsTUI();
tui.run().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});