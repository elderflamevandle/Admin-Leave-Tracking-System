  Step 1: Open a new Claude Code session in the same directory:                                                     
  cd F:\Admin_Leaves_Tracking
  claude                                                                                                            
                                                    
  Step 2: Give this prompt:
  Use superpowers:subagent-driven-development to execute the implementation plan at
  docs/superpowers/plans/2026-04-13-vc-crm-phase1.md — start from Task 1.

  That's it. The plan is self-contained — the subagent skill will:
  1. Read the plan
  2. Dispatch a fresh agent for each task
  3. Review the output between tasks
  4. Move to the next task automatically

  If you want to start from a specific task later (e.g., after a break), just say:
  Use superpowers:subagent-driven-development to execute the plan at
  docs/superpowers/plans/2026-04-13-vc-crm-phase1.md — start from Task N.