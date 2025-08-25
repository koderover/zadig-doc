---
title: Mirrored Version Fallback in Workflows
date: 2021-12-15 18:53:06
permalink: /en/Zadig v4.0/workflow/image/rollback/
---

This article introduces the image version fallback capability supported by workflows: After running the workflow according to the process, the image of the updated service in the integrated environment will be rolled back to the version before the workflow ran, based on the actual results of the workflow tasks and the set rollback strategy.

> [K8s YAML Deployed projects](/en/Zadig%20v4.0/project/k8s-yaml/) and [Helm Chart Deployed projects](/en/Zadig%20v4.0/project/helm-chart/) support the image version fallback function.

## Mirror Version Fallback

> The mirror version fallback function is effective for workflows that use `构建部署` in the deployment phase.

Edit the workflow, enable the mirror version fallback function, and save it to activate this feature.

![Enable Mirror Version Fallback](../../../../_images/check_pipeline_setting.png)

## Applicable Scenarios

The mirror version fallback function is applicable to, but not limited to, the following scenarios:

1. Multiple people collaborate to use an integrated environment. Developers want to verify whether code changes can be built, deployed, and pass tests. After verification, regardless of the workflow's results, they do not want to change the service image version in the integrated environment to avoid unexpected issues for other users. In this case, set the rollback policy to `任务执行完成`.
2. When using workflows to deploy and update services, if the deployment fails, you do not want the service image version in the integrated environment to be affected by this failure. In this case, set the rollback policy to `部署结果失败`.
3. The workflow includes build deployment and testing steps. If the testing steps fail, the updated service image should be rolled back. In this case, set the rollback policy to `测试结果失败`.