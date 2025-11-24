#!/usr/bin/env node

/**
 * Research Wizard CLI
 * Interactive command-line interface for starting research projects
 */

import * as readline from "readline"
import { ResearchManager } from "./research-manager"
import chalk from "chalk"

interface ResearchWizardConfig {
  topic: string
  depth: "quick" | "standard" | "deep"
  focus?: string
  style?: "comprehensive" | "comparing" | "practical"
}

class ResearchWizard {
  private rl: readline.Interface
  private manager: ResearchManager

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    this.manager = new ResearchManager()
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer)
      })
    })
  }

  private log(message: string, color?: 'cyan' | 'green' | 'red' | 'yellow' | 'gray' | 'magenta' | 'blue') {
    if (color && typeof (chalk as any)[color] === 'function') {
      console.log((chalk as any)[color](message))
    } else {
      console.log(message)
    }
  }

  async run() {
    console.clear()
    this.log("\n╔════════════════════════════════════════╗", "cyan")
    this.log("║     Research Wizard - Interactive      ║", "cyan")
    this.log("║  Trigger Agent-Driven Research Tasks   ║", "cyan")
    this.log("╚════════════════════════════════════════╝\n", "cyan")

    // Main menu
    const choice = await this.mainMenu()

    if (choice === "1") {
      await this.startNewResearch()
    } else if (choice === "2") {
      await this.viewResearchHistory()
    } else if (choice === "3") {
      await this.viewActiveAgents()
    } else if (choice === "4") {
      this.log("\nGoodbye!", "green")
      this.rl.close()
      this.manager.close()
      process.exit(0)
    }
  }

  private async mainMenu(): Promise<string> {
    this.log("\nWhat would you like to do?\n", "yellow")
    this.log("  1) Start a new research project")
    this.log("  2) View research history")
    this.log("  3) View active agents")
    this.log("  4) Exit")

    const choice = await this.question("\nEnter your choice (1-4): ")
    return choice.trim()
  }

  private async startNewResearch() {
    console.clear()
    this.log("\n📊 New Research Project\n", "magenta")

    // Topic
    let topic = ""
    while (!topic) {
      topic = (await this.question("Research topic: ")).trim()
      if (!topic) {
        this.log("Topic cannot be empty", "red")
      }
    }

    // Depth
    this.log("\nHow deep should the research be?\n", "yellow")
    this.log("  1) Quick (15-20 minutes of research)")
    this.log("  2) Standard (45-60 minutes of research)")
    this.log("  3) Deep (comprehensive, 2+ hours)")

    let depth: "quick" | "standard" | "deep" = "standard"
    const depthChoice = await this.question("\nEnter choice (1-3, default: 2): ")
    if (depthChoice.trim() === "1") depth = "quick"
    if (depthChoice.trim() === "3") depth = "deep"

    // Focus area (optional)
    const focus = await this.question("\nSpecific focus area? (optional, press Enter to skip): ")

    // Style
    this.log("\nHow should the research be structured?\n", "yellow")
    this.log("  1) Comprehensive (detailed documentation)")
    this.log("  2) Comparing (focus on comparisons)")
    this.log("  3) Practical (actionable insights)")

    let style: "comprehensive" | "comparing" | "practical" = "comprehensive"
    const styleChoice = await this.question("\nEnter choice (1-3, default: 1): ")
    if (styleChoice.trim() === "2") style = "comparing"
    if (styleChoice.trim() === "3") style = "practical"

    // Confirm
    this.log("\n" + "=".repeat(50), "cyan")
    this.log("Research Configuration:", "cyan")
    this.log("=".repeat(50), "cyan")
    this.log(`Topic:  ${topic}`)
    this.log(`Depth:  ${depth}`)
    if (focus) this.log(`Focus:  ${focus}`)
    this.log(`Style:  ${style}`)
    this.log("=".repeat(50) + "\n", "cyan")

    const confirm = await this.question("Start this research? (y/n): ")

    if (confirm.toLowerCase() === "y") {
      try {
        this.log("\n⏳ Initiating research...", "yellow")

        const config: ResearchWizardConfig = {
          topic,
          depth,
          focus: focus || undefined,
          style,
        }

        const researchId = await this.manager.startResearch(config)

        this.log(`\n✅ Research started!`, "green")
        this.log(`\nResearch ID: ${researchId}`, "cyan")
        this.log(
          "\nThe AI agent is now conducting research in the background.",
          "yellow"
        )
        this.log("You can track progress using the Research Portal or side panel.\n", "yellow")

        const viewStatus = await this.question("View research status? (y/n): ")
        if (viewStatus.toLowerCase() === "y") {
          await this.showResearchStatus(researchId)
        }
      } catch (error) {
        this.log(
          `\n❌ Error starting research: ${error instanceof Error ? error.message : String(error)}`,
          "red"
        )
      }
    } else {
      this.log("\nResearch cancelled.", "yellow")
    }

    // Return to menu
    await this.returnToMenu()
  }

  private async showResearchStatus(researchId: string) {
    this.log("\n📋 Research Status\n", "cyan")

    const status = await this.manager.getResearchStatus(researchId)

    if (!status) {
      this.log("Research not found", "red")
      return
    }

    const { research, agents } = status

    this.log(`Topic: ${research.topic}`)
    this.log(`Status: ${research.status}`)
    this.log(`Created: ${new Date(research.createdAt).toLocaleString()}`)
    this.log(`Project Directory: ${research.projectDir}\n`)

    this.log("Agents:", "yellow")
    for (const agent of agents) {
      const statusColor: 'green' | 'red' | 'yellow' | 'gray' =
        agent.status === "completed"
          ? "green"
          : agent.status === "failed"
            ? "red"
            : agent.status === "running"
              ? "yellow"
              : "gray"

      this.log(
        `  • ${agent.name} [${agent.status}]`,
        statusColor
      )

      if (agent.activities.length > 0) {
        const lastActivity = agent.activities[0]
        this.log(
          `    Last activity: ${lastActivity.action} - ${lastActivity.description}`
        )
      }
    }
  }

  private async viewResearchHistory() {
    console.clear()
    this.log("\n📚 Research History\n", "magenta")

    const { researches, stats, recentActivities } = this.manager.getAllResearches()

    // Statistics
    this.log("Statistics:", "cyan")
    this.log(`  Total Research Projects: ${stats.researches.total}`)
    this.log(`  Completed: ${stats.researches.completed}`)
    this.log(`  Total Agents Spawned: ${stats.agents.total}`)
    this.log(`  Completed Agents: ${stats.agents.completed}`)
    this.log(`  Total Activities Logged: ${stats.activities}\n`)

    // Recent researches
    if (researches.length > 0) {
      this.log("Recent Research Projects:", "yellow")
      for (const research of researches.slice(0, 10)) {
         const statusColor: 'green' | 'red' | 'yellow' =
           research.status === "completed"
             ? "green"
             : research.status === "failed"
               ? "red"
               : "yellow"

         const date = new Date(research.createdAt).toLocaleDateString()
         this.log(
           `  • ${research.topic} [${research.status}] - ${date}`,
           statusColor
         )
       }
    }

    // Recent activities
    if (recentActivities.length > 0) {
      this.log("\nRecent Activities:", "yellow")
      for (const activity of recentActivities.slice(0, 10)) {
        const time = new Date(activity.timestamp).toLocaleTimeString()
        this.log(`  • ${time} - ${activity.action}: ${activity.description}`)
      }
    }

    await this.returnToMenu()
  }

  private async viewActiveAgents() {
    console.clear()
    this.log("\n🤖 Active Agents\n", "magenta")

    const { researches } = this.manager.getAllResearches()

    const activeResearches = researches.filter(
      (r) => r.status === "pending" || r.status === "in_progress"
    )

    if (activeResearches.length === 0) {
      this.log("No active research projects.", "yellow")
    } else {
      this.log(`${activeResearches.length} active research project(s):\n`, "cyan")

      for (const research of activeResearches) {
        this.log(`\n📍 ${research.topic}`, "yellow")
        this.log(`   Status: ${research.status}`)
        this.log(`   Started: ${new Date(research.createdAt).toLocaleString()}`)
        this.log(`   Project: ${research.projectDir}`)

        // Show agent details if available
        const status = await this.manager.getResearchStatus(research.id)
        if (status && status.agents.length > 0) {
          for (const agent of status.agents) {
            const statusIcon =
              agent.status === "running"
                ? "⏳"
                : agent.status === "completed"
                  ? "✅"
                  : agent.status === "failed"
                    ? "❌"
                    : "⏸️"

            this.log(`   ${statusIcon} Agent: ${agent.name} [${agent.status}]`)
          }
        }
      }
    }

    await this.returnToMenu()
  }

  private async returnToMenu() {
    await this.question("\nPress Enter to return to menu...")
    await this.run()
  }
}

// Run the wizard
const wizard = new ResearchWizard()
wizard.run().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
