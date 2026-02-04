// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas variáveis de ambiente se preferir, mas aqui está pronto para uso:
const supabaseUrl = 'https://ovaftdksdrsgglobuudd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92YWZ0ZGtzZHJzZ2dsb2J1dWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NjI2ODAsImV4cCI6MjA4MzMzODY4MH0.iV6jnqnoG8UcNkKPPpEkyIU9hVe8zS4e3VYACADb7KQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
