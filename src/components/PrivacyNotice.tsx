/**
 * Privacy Notice Component
 * COPPA-compliant notice explaining data practices
 */

export function PrivacyNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1a1a] border-4 border-[#373737] max-w-2xl w-full py-6 px-6">
        <h2 className="text-2xl font-bold text-white mb-4">Privacy & Safety</h2>

        <div className="space-y-4 text-sm text-gray-200 mb-6">
          <section>
            <h3 className="text-green-400 font-bold mb-2">What We Collect</h3>
            <p>
              BibleCraft only collects a display name of your choice (like "BraveElijah42"). We do NOT collect:
            </p>
            <ul className="list-disc list-inside mt-1 text-gray-300 space-y-1">
              <li>Your real name or personal information</li>
              <li>Email address or phone number</li>
              <li>Location or device information</li>
              <li>Photos or personal images</li>
              <li>Any biometric data</li>
            </ul>
          </section>

          <section>
            <h3 className="text-green-400 font-bold mb-2">How We Use Your Data</h3>
            <p>
              Your display name and game progress are used only to:
            </p>
            <ul className="list-disc list-inside mt-1 text-gray-300 space-y-1">
              <li>Show your progress in the game</li>
              <li>Display your performance on campus leaderboards</li>
              <li>Help your campus pastor understand engagement with Bible content</li>
            </ul>
          </section>

          <section>
            <h3 className="text-green-400 font-bold mb-2">No Tracking or Ads</h3>
            <p>
              BibleCraft does not:
            </p>
            <ul className="list-disc list-inside mt-1 text-gray-300 space-y-1">
              <li>Track you across websites or apps</li>
              <li>Show behavioral advertising</li>
              <li>Sell your data to third parties</li>
              <li>Collect data for marketing purposes</li>
            </ul>
          </section>

          <section>
            <h3 className="text-green-400 font-bold mb-2">Parent Gate</h3>
            <p>
              Before playing, an adult must solve a simple math problem to confirm they are okay with their child playing this game.
            </p>
          </section>

          <section>
            <h3 className="text-green-400 font-bold mb-2">Questions?</h3>
            <p>
              Contact your campus pastor or visit biblecraft.church for more information.
            </p>
          </section>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="mc-btn mc-btn-green px-6 py-2 text-sm"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
