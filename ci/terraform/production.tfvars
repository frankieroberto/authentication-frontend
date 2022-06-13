environment         = "production"
common_state_bucket = "digital-identity-prod-tfstate"
ecs_desired_count   = 4

frontend_auto_scaling_enabled   = true
frontend_task_definition_cpu    = 512
frontend_task_definition_memory = 1024
frontend_auto_scaling_min_count = 4
frontend_auto_scaling_max_count = 12