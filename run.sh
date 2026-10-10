#!/bin/bash
# watchdog: exactly one publisher loop (flock-guarded)
if [ "$1" != loop ]; then nohup /workspace/bot-office/run.sh loop >> /workspace/bot-office/publisher.log 2>&1 & exit 0; fi
exec 9>/tmp/bot-office.lock; flock -n 9 || exit 0
while true; do /usr/bin/node /workspace/bot-office/publisher.js; sleep 10; done
