/**
 * Storage Diagnostic Script
 * Run this in your browser console to diagnose storage issues
 * 
 * Usage:
 * 1. Go to your Bulletin Board app
 * 2. Open browser DevTools (F12)
 * 3. Paste this entire script into the Console
 * 4. Press Enter
 */

async function diagnoseStorage() {
  console.log('%c📦 Storage Diagnosis', 'font-size: 16px; font-weight: bold; color: #2563eb;');
  console.log('═'.repeat(50));

  try {
    // Import supabase
    const { supabase } = await import('/src/api/supabaseClient.js').catch(() => {
      console.error('❌ Could not import supabaseClient');
      return {};
    });

    if (!supabase) {
      console.error('❌ Supabase client not available');
      return;
    }

    // 1. Check Authentication
    console.log('\n%c1️⃣ Authentication Status', 'font-weight: bold; color: #2563eb;');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ Logged in as:', user.email);
      console.log('   User ID:', user.id);
    } else {
      console.warn('⚠️  Not logged in (anonymous access)');
    }

    // 2. Check Bucket Existence
    console.log('\n%c2️⃣ Storage Buckets', 'font-weight: bold; color: #2563eb;');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
    } else {
      console.log('📋 Available buckets:');
      buckets.forEach(b => {
        console.log(`   ${b.public ? '🔓' : '🔒'} ${b.name} (${b.id})`);
      });
      
      const hasAssets = buckets.some(b => b.name === 'assets');
      if (hasAssets) {
        console.log('✅ "assets" bucket exists');
      } else {
        console.error('❌ "assets" bucket NOT found. Create it in Supabase Dashboard.');
      }
    }

    // 3. Test Bucket Access
    console.log('\n%c3️⃣ Bucket Permissions Test', 'font-weight: bold; color: #2563eb;');
    
    if (user) {
      // Try to create a test file
      const testFileName = `.storage_test_${Date.now()}.txt`;
      const testContent = 'Storage test file';
      const testFile = new File([testContent], testFileName, { type: 'text/plain' });

      const { data, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(`posts/${testFileName}`, testFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError.message);
        
        // Analyze the error
        if (uploadError.message.includes('row-level security')) {
          console.error('   → Issue: RLS policies not configured');
          console.log('   → Solution: See STORAGE_RLS_SETUP.md');
        } else if (uploadError.message.includes('not found')) {
          console.error('   → Issue: Bucket not found');
          console.log('   → Solution: Create "assets" bucket in Supabase Storage');
        } else if (uploadError.message.includes('unauthorized')) {
          console.error('   → Issue: Authorization failed');
          console.log('   → Solution: Check you are logged in');
        }
      } else {
        console.log('✅ Upload successful to posts/ folder');
        
        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from('assets')
          .remove([`posts/${testFileName}`]);
        
        if (!deleteError) {
          console.log('✅ Cleanup successful');
        } else {
          console.warn('⚠️  Cleanup failed (test file not deleted)');
        }
      }
    } else {
      console.warn('⚠️  Skipping upload test (not authenticated)');
    }

    // 4. Check Environment Variables
    console.log('\n%c4️⃣ Environment Configuration', 'font-weight: bold; color: #2563eb;');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl) {
      console.log('✅ VITE_SUPABASE_URL configured');
      console.log('   Project:', supabaseUrl.split('https://')[1].split('.')[0]);
    } else {
      console.error('❌ VITE_SUPABASE_URL not configured');
    }

    if (supabaseKey) {
      console.log('✅ VITE_SUPABASE_ANON_KEY configured');
    } else {
      console.error('❌ VITE_SUPABASE_ANON_KEY not configured');
    }

    // 5. List files in posts folder (if accessible)
    console.log('\n%c5️⃣ Posts Folder Contents', 'font-weight: bold; color: #2563eb;');
    
    const { data: files, error: listError } = await supabase.storage
      .from('assets')
      .list('posts', { limit: 10 });

    if (listError) {
      console.warn('⚠️  Cannot list posts folder:', listError.message);
    } else {
      if (files.length === 0) {
        console.log('📭 No files in posts/ folder');
      } else {
        console.log(`📂 Files in posts/ (showing ${Math.min(files.length, 10)}/${files.length}):`);
        files.slice(0, 10).forEach(f => {
          console.log(`   📄 ${f.name}`);
        });
      }
    }

    // 6. Summary
    console.log('\n%c📝 Summary', 'font-weight: bold; color: #2563eb; font-size: 14px;');
    console.log('═'.repeat(50));
    
    const readyToUpload = user && buckets?.some(b => b.name === 'assets');
    
    if (readyToUpload) {
      console.log('✅ Storage appears to be configured correctly!');
      console.log('Try uploading an image in post creation.');
    } else {
      console.log('❌ Storage is not fully configured.');
      console.log('Follow the setup steps in STORAGE_RLS_SETUP.md');
    }

  } catch (error) {
    console.error('❌ Diagnosis error:', error.message);
    console.error('Make sure you are on the Bulletin Board app page.');
  }
}

// Run diagnosis
diagnoseStorage().catch(console.error);

// Export for manual use
window.diagnoseStorage = diagnoseStorage;
console.log('✨ Diagnostic complete. Run diagnoseStorage() to run again.');
