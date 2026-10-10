#!/bin/bash
# watchdog: keep publisher running
pgrep -f "bot-office/run.sh loop" >/dev/null && [ "$1" != loop ] && exit 0
[ "$1" != loop ] && { nohup "$0" loop >> /workspace/bot-office/publisher.log 2>&1 & exit 0; }
while true; do /usr/bin/node /workspace/bot-office/publisher.js; sleep 10; done
