from datetime import datetime, timedelta, timezone
from typing import List

from sqlalchemy import select, update
from core import app_state
from core.events import track
from models import AsyncSessionLocal, Reminder

async def enable_reminder(tg_id: int, months: int = 6) -> Reminder:
    """Enable a reminder for the given user, X months from now."""
    tenant_id = app_state.get_tenant_id()
    bot_id = app_state.get_bot_id()
    now = datetime.now(timezone.utc)
    next_remind = now + timedelta(days=30 * months)
    
    async with AsyncSessionLocal() as session:
        # Check if reminder already exists
        result = await session.execute(
            select(Reminder).where(
                Reminder.tg_id == tg_id,
                Reminder.tenant_id == tenant_id,
                Reminder.bot_id == bot_id
            )
        )
        reminder = result.scalars().first()
        
        if reminder:
            reminder.enabled = True
            reminder.next_remind_at = next_remind.isoformat()
            reminder.updated_at = now.isoformat()
        else:
            reminder = Reminder(
                tg_id=tg_id,
                tenant_id=tenant_id,
                bot_id=bot_id,
                enabled=True,
                mode="date",
                next_remind_at=next_remind.isoformat(),
                created_at=now.isoformat(),
                updated_at=now.isoformat(),
            )
            session.add(reminder)
            
        await session.commit()
        await session.refresh(reminder)
        
    await track("reminder.enabled", tg_id, {
        "mode": "date",
        "months": months,
        "next_remind_at": reminder.next_remind_at
    })
    return reminder

async def list_due_reminders(now: datetime) -> List[Reminder]:
    """List reminders that are due and enabled."""
    tenant_id = app_state.get_tenant_id()
    bot_id = app_state.get_bot_id()
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Reminder).where(
                Reminder.tenant_id == tenant_id,
                Reminder.bot_id == bot_id,
                Reminder.enabled == True,
                Reminder.next_remind_at <= now.isoformat()
            )
        )
        return list(result.scalars().all())

async def process_due_reminders() -> int:
    """Process all due reminders (send dummy message and track)."""
    now = datetime.now(timezone.utc)
    due_reminders = await list_due_reminders(now)
    count = 0
    
    # We use a new session to update reminders after processing
    async with AsyncSessionLocal() as session:
        for r in due_reminders:
            # Re-fetch to ensure attached to session (or use existing if possible)
            # Simple approach: just use the ID
            reminder = await session.get(Reminder, r.id)
            if not reminder or not reminder.enabled:
                continue
                
            # Logic: Send message (Mock)
            # In real app: await bot.send_message(reminder.tg_id, "Пора...")
            
            # Track event
            await track("reminder.sent", reminder.tg_id, {
                "mode": "date",
                "reminder_id": reminder.id
            })
            
            # Disable reminder after sending (or reschedule)
            # For now: disable
            reminder.enabled = False
            reminder.updated_at = now.isoformat()
            count += 1
        
        await session.commit()
        
    return count
