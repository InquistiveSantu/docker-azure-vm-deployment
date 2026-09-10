# Azure DevOps Pipeline Guide

## Overview
This document outlines the Azure DevOps Classic Pipeline setup for automated building, publishing, and deploying the CyberOps Command Center application.

## Pipeline Configuration
- **Pipeline Type**: Azure DevOps Classic Pipeline
- **Triggers**: Repository commit/branch triggers

## Pipeline Stages
1. **Build**: Build Docker container image.
2. **Push**: Push image artifact to Docker Hub registry.
3. **Deploy**: Trigger deployment tasks onto the Azure VM.

## Service Connections & Security
- Docker Registry connection for Docker Hub authentication.
- SSH / Azure agent connection for host deployment.

## Execution History & Artifacts
- Pipeline run results and execution output stored under `docs/evidence/pipeline-runs/`.
- Pipeline UI configuration screenshots stored under `docs/screenshots/pipeline/`.
