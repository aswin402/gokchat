use keyring::Entry;

const SERVICE_NAME: &str = "gokchat";

pub fn store_key(provider: &str, key: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider).map_err(|e| e.to_string())?;
    entry.set_password(key).map_err(|e| e.to_string())
}

pub fn retrieve_key(provider: &str) -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, provider).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

pub fn remove_key(provider: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider).map_err(|e| e.to_string())?;
    // delete_password or delete_credential depending on keyring version
    // In keyring v4, it is delete_credential() or delete_password()
    // Let's use delete_credential() or delete_password(). delete_credential() deletes the whole entry.
    // Let's check delete_credential.
    entry.delete_credential().map_err(|e| e.to_string())
}

pub fn has_key(provider: &str) -> bool {
    if let Ok(entry) = Entry::new(SERVICE_NAME, provider) {
        entry.get_password().is_ok()
    } else {
        false
    }
}
