encrypted_flag="CTF\x7bV}`n|k\x7bC\x60h`\x7b"

decrypt_flag() {
    local encrypted="$1"
    local decrypted=""
    for ((i=0; i<${#encrypted}; i++)); do
        decrypted+=$(printf "\\x$(printf %x "$(( $(printf '%d' "'${encrypted:$i:1}") ^ 7 ))")")
    done
    echo "$decrypted"
}

echo "Welcome to the Shell Game!"
echo "There are 3 shells: 1, 2, and 3."
echo "The ball is hidden under one of the shells."
echo "Your task is to find the ball!"


ball_position=$((RANDOM % 3 + 1))
attempts=3  

shuffle_positions() {
    echo "Shuffling the shells..."
    for i in {1..5}; do
        ball_position=$((RANDOM % 3 + 1))
        sleep 0.3
    done
}

shuffle_positions


while (( attempts > 0 )); do
    echo
    echo "Choose a shell (1, 2, or 3): "
    read -r guess

    if [[ ! $guess =~ ^[1-3]$ ]]; then
        echo "Invalid choice! Please choose 1, 2, or 3."
        continue
    fi

    if (( guess == ball_position )); then
        echo "Congratulations! You found the ball!"
        echo "Decrypting your reward..."
        sleep 1
        decrypt_flag "$encrypted_flag"
        exit 0
    else
        echo "Wrong guess! Try again."
        ((attempts--))
        if (( attempts > 0 )); then
            shuffle_positions
        fi
    fi
done


echo "Game over! Better luck next time."
exit 1